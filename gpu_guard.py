import os
import time
import torch
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP
import argparse

def train(args):
    rank = int(os.environ["RANK"])
    local_rank = int(os.environ["LOCAL_RANK"])
    world_size = int(os.environ["WORLD_SIZE"])

    device = torch.device(f"cuda:{local_rank}")
    torch.cuda.set_device(device)

    dist.init_process_group(backend="nccl", init_method="env://")

    model = torch.nn.Linear(1200, 1200).to(device)
    ddp_model = DDP(model, device_ids=[local_rank])

    inputs = torch.randn(1200, 1200).to(device)

    if rank == 0:
        print(f"[RANK 0] Starting task: {args.name} on {world_size} GPUs")

    last_print = time.time()
    try:
        while True:
            outputs = ddp_model(inputs)
            loss = outputs.sum()
            loss.backward()

            now = time.time()
            if rank == 0 and (now - last_print >= 60):
                print(f"[RANK 0] alive at {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(now))}")
                last_print = now
    except KeyboardInterrupt:
        if rank == 0:
            print(f"[RANK 0] Stopped by user.")
    finally:
        dist.destroy_process_group()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--name', type=str, default='hold')
    args = parser.parse_args()
    train(args)
